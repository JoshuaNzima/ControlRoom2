<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\HelpArticle;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite as Site;
use App\Models\Client;
use App\Models\User;
use App\Models\AiSetting;
use App\Notifications\ChatTransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ChatController extends Controller
{
    /**
     * Handle AI chat requests with session management.
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'context' => 'nullable|string|max:100',
            'history' => 'nullable|array|max:10',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:2000',
            'session_id' => 'nullable|string|max:100',
            'user_role' => 'nullable|string|max:100',
            'page_data' => 'nullable|array',
        ]);

        $message = $validated['message'];
        $context = $validated['context'] ?? 'general';
        $history = $validated['history'] ?? [];
        $sessionId = $validated['session_id'] ?? $this->generateSessionId();
        $userRole = $validated['user_role'] ?? 'user';
        $pageData = $validated['page_data'] ?? [];
        $userId = Auth::id();

        // Find or create chat session
        $session = ChatSession::findOrCreateBySessionId($sessionId, $userId, $context);

        // Check if session is transferred to human agent
        if ($session->isTransferred()) {
            ChatMessage::createMessage($session, ChatMessage::SENDER_USER, $message, $userId);

            return response()->json([
                'success' => true,
                'response' => 'Your message has been sent to a support agent. They will respond shortly.',
                'session_id' => $sessionId,
                'transferred' => true,
            ]);
        }

        // Store user message
        ChatMessage::createMessage($session, ChatMessage::SENDER_USER, $message, $userId);

        // Check for transfer request
        if ($this->isTransferRequest($message)) {
            return $this->handleTransferRequest($session, $sessionId);
        }

        // Build comprehensive system prompt with user context
        $systemPrompt = $this->buildEnhancedSystemPrompt($context, $userRole, $pageData);
        $messages = $this->buildMessagesArray($systemPrompt, $history, $message);

        try {
            // Get active AI provider from database (cached)
            $provider = Cache::remember('ai_active_provider', 300, function () {
                return AiSetting::getActiveProvider();
            });

            if (!$provider || !$provider->hasApiKey()) {
                // Fallback to config if no database provider configured
                $apiKey = config('services.openai.api_key');
                if (empty($apiKey)) {
                    $response = $this->getSmartFallbackResponse($message, $context, $userRole, $pageData);
                } else {
                    $response = $this->callOpenAI($apiKey, $messages, config('services.openai.model', 'gpt-3.5-turbo'));
                }
            } else {
                $response = $this->callAI($provider, $messages);
            }

            ChatMessage::createMessage($session, ChatMessage::SENDER_ASSISTANT, $response);

            return response()->json([
                'success' => true,
                'response' => $response,
                'session_id' => $sessionId,
            ]);

        } catch (\Exception $e) {
            \Log::error('AI Chat Error: ' . $e->getMessage());

            $fallback = $this->getSmartFallbackResponse($message, $context, $userRole, $pageData);
            ChatMessage::createMessage($session, ChatMessage::SENDER_ASSISTANT, $fallback);

            return response()->json([
                'success' => true,
                'response' => $fallback,
                'session_id' => $sessionId,
            ]);
        }
    }

    /**
     * Request transfer to human agent.
     */
    public function requestTransfer(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
            'reason' => 'nullable|string|max:500',
        ]);

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        // Set session to pending transfer
        $session->update(['status' => ChatSession::STATUS_PENDING_TRANSFER]);

        ChatMessage::createMessage(
            $session,
            ChatMessage::SENDER_ASSISTANT,
            "Your request has been queued. A support agent will get back to you as soon as possible.",
            null,
            ['transfer_reason' => $validated['reason'] ?? null]
        );

        // Notify all super_admin and control_room_operator users
        $agents = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['super_admin', 'control_room_operator', 'admin']);
        })->get();

        foreach ($agents as $agent) {
            $agent->notify(new ChatTransferRequest($session, $validated['reason'] ?? null));
        }

        return response()->json([
            'success' => true,
            'transferred' => false,
            'message' => 'Your request has been sent to our support team. Someone will respond shortly.',
        ]);
    }

    /**
     * Agent responds to transferred chat.
     */
    public function agentRespond(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
            'message' => 'required|string|max:2000',
        ]);

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        $agentId = Auth::id();

        ChatMessage::createMessage($session, ChatMessage::SENDER_AGENT, $validated['message'], $agentId);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Get chat history for a session.
     */
    public function history(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
        ]);

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => true,
                'messages' => [],
            ]);
        }

        $messages = $session->messages()
            ->orderBy('created_at', 'asc')
            ->get(['sender_type', 'message', 'created_at']);

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'status' => $session->status,
        ]);
    }

    /**
     * Get pending transfer requests for agents.
     */
    public function pendingTransfers(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || !$user->hasAnyRole(['super_admin', 'control_room_operator', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $sessions = ChatSession::where('status', ChatSession::STATUS_PENDING_TRANSFER)
            ->with(['user:id,name,email', 'messages' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(5);
            }])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_id' => $session->session_id,
                    'user' => $session->user ? [
                        'id' => $session->user->id,
                        'name' => $session->user->name,
                        'email' => $session->user->email,
                    ] : null,
                    'context' => $session->context,
                    'metadata' => $session->metadata,
                    'message_count' => $session->messages()->count(),
                    'last_message' => $session->messages()->latest()->first()?->message,
                    'created_at' => $session->created_at->toISOString(),
                    'updated_at' => $session->updated_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'sessions' => $sessions,
        ]);
    }

    /**
     * Accept a transfer request.
     */
    public function acceptTransfer(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
        ]);

        $user = Auth::user();
        
        if (!$user || !$user->hasAnyRole(['super_admin', 'control_room_operator', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        if ($session->status !== ChatSession::STATUS_PENDING_TRANSFER) {
            return response()->json([
                'success' => false,
                'message' => 'Session is not pending transfer',
            ], 400);
        }

        $session->transferTo($user);

        ChatMessage::createMessage(
            $session,
            ChatMessage::SENDER_AGENT,
            "Hello! I'm {$user->name}, and I'll be helping you today. How can I assist you?",
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Transfer accepted successfully',
        ]);
    }

    /**
     * Reject a transfer request.
     */
    public function rejectTransfer(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        
        if (!$user || !$user->hasAnyRole(['super_admin', 'control_room_operator', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        if ($session->status !== ChatSession::STATUS_PENDING_TRANSFER) {
            return response()->json([
                'success' => false,
                'message' => 'Session is not pending transfer',
            ], 400);
        }

        // Keep session as pending for other agents to pick up
        // Just log the rejection
        \Log::info("Chat transfer rejected", [
            'session_id' => $session->session_id,
            'rejected_by' => $user->id,
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transfer rejected',
        ]);
    }

    /**
     * Resolve a transferred chat.
     */
    public function resolveChat(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:100',
        ]);

        $user = Auth::user();
        
        if (!$user || !$user->hasAnyRole(['super_admin', 'control_room_operator', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $session = ChatSession::where('session_id', $validated['session_id'])->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        }

        $session->resolve();

        ChatMessage::createMessage(
            $session,
            ChatMessage::SENDER_AGENT,
            "Thank you for contacting support. Your issue has been resolved. Have a great day!",
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Chat resolved successfully',
        ]);
    }

    /**
     * Get active chats for the current agent.
     */
    public function agentChats(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || !$user->hasAnyRole(['super_admin', 'control_room_operator', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $sessions = ChatSession::where('transferred_to', $user->id)
            ->where('status', ChatSession::STATUS_TRANSFERRED)
            ->with(['user:id,name,email', 'messages' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->orderBy('transferred_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_id' => $session->session_id,
                    'user' => $session->user ? [
                        'id' => $session->user->id,
                        'name' => $session->user->name,
                        'email' => $session->user->email,
                    ] : null,
                    'context' => $session->context,
                    'messages' => $session->messages->map(function ($msg) {
                        return [
                            'id' => $msg->id,
                            'sender_type' => $msg->sender_type,
                            'sender_id' => $msg->sender_id,
                            'message' => $msg->message,
                            'created_at' => $msg->created_at->toISOString(),
                        ];
                    }),
                    'transferred_at' => $session->transferred_at?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'sessions' => $sessions,
        ]);
    }

    /**
     * Generate unique session ID.
     */
    protected function generateSessionId(): string
    {
        return 'chat_' . \Str::random(32);
    }

    /**
     * Check if message is a transfer request.
     */
    protected function isTransferRequest(string $message): bool
    {
        $keywords = ['speak to human', 'talk to human', 'human agent', 'real person', 'live agent', 'support agent'];
        $lowerMessage = strtolower($message);

        foreach ($keywords as $keyword) {
            if (str_contains($lowerMessage, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle transfer request.
     */
    protected function handleTransferRequest(ChatSession $session, string $sessionId)
    {
        $session->update(['status' => 'pending_transfer']);

        ChatMessage::createMessage(
            $session,
            ChatMessage::SENDER_ASSISTANT,
            "I understand you'd like to speak with a human agent. I'm connecting you now..."
        );

        return response()->json([
            'success' => true,
            'response' => "I'll connect you with a human agent. Please wait a moment...",
            'session_id' => $sessionId,
            'transfer_requested' => true,
        ]);
    }

    /**
     * Build enhanced system prompt with full context.
     */
    protected function buildEnhancedSystemPrompt(string $context, string $userRole, array $pageData): string
    {
        $user = Auth::user();
        $userName = $user ? $user->name : 'User';

        // Get system statistics for context
        $stats = $this->getSystemStats($userRole);

        // Build role-specific capabilities
        $roleCapabilities = $this->getRoleCapabilities($userRole);

        // Build context-specific information
        $contextInfo = $this->getDetailedContextInfo($context, $userRole);

        $prompt = "You are a helpful AI assistant for ControlRoom, a security management system used by Coin Security.\n\n";

        $prompt .= "## Current User\n";
        $prompt .= "- Name: {$userName}\n";
        $prompt .= "- Role: {$userRole}\n";
        $prompt .= "- Current Area: {$context}\n\n";

        $prompt .= "## User Capabilities\n";
        $prompt .= $roleCapabilities . "\n\n";

        $prompt .= "## Current Context\n";
        $prompt .= $contextInfo . "\n\n";

        $prompt .= "## System Statistics\n";
        $prompt .= $stats . "\n\n";

        $prompt .= "## Guidelines\n";
        $prompt .= "- Be concise and helpful. Answer questions directly.\n";
        $prompt .= "- Provide step-by-step instructions when explaining how to do something.\n";
        $prompt .= "- Reference the user's role and permissions when relevant.\n";
        $prompt .= "- If the user can't do something due to permissions, explain what role is needed.\n";
        $prompt .= "- Suggest relevant actions they can take in their current area.\n";
        $prompt .= "- If asked about data you don't have, direct them to the appropriate page.\n";
        $prompt .= "- For complex issues, offer to connect them with a human agent.\n";
        $prompt .= "- Never make up information. If unsure, say so and offer alternatives.\n";

        return $prompt;
    }

    /**
     * Get role-specific capabilities.
     */
    protected function getRoleCapabilities(string $role): string
    {
        $capabilities = [
            'super_admin' => "Full system access. Can: manage all users and roles, configure system settings, manage modules, view all reports, access backups and logs, manage all clients and sites, process payroll, manage all guards and assignments.",
            'admin' => "Administrative access. Can: manage users (except super admins), manage clients and sites, manage guards and assignments, process payroll, view reports, manage vehicles and equipment, configure settings within their scope.",
            'hr' => "HR module access. Can: manage employees and guards, handle training programs, manage benefits and compensation, process medical claims, handle pensions, view HR reports, manage leave and off-days.",
            'finance' => "Finance module access. Can: process payroll, manage requisitions, handle invoices, manage budgets, view financial reports, process payments, manage client billing.",
            'asset_manager' => "Assets module access. Can: manage vehicles and equipment, dispatch vehicles, track asset utilization, manage maintenance, handle equipment handovers.",
            'control_room' => "Control room access. Can: monitor guard attendance, handle check-ins/check-outs, create incidents, view real-time operations, manage checkpoints, respond to alerts.",
            'supervisor' => "Supervisor access. Can: view their zone's guards, manage attendance for their zone, view zone reports, handle incidents in their zone.",
            'zone_commander' => "Zone commander access. Can: manage guards in their zone, handle assignments, view zone operations, respond to zone incidents.",
            'operations_manager' => "Operations access. Can: manage all assignments, handle scheduling, create and manage incidents, view operational reports, coordinate guards across sites.",
            'client' => "Client portal access. Can: view their sites and assigned guards, view reports for their sites, view invoices and billing, submit requests.",
            'guard' => "Guard access. Can: check in/out at sites, view their schedule, view their payslips, update their profile.",
            'marketing' => "Marketing access. Can: manage campaigns, handle leads, view marketing analytics.",
            'training' => "Training access. Can: manage trainees and trainers, create training programs, evaluate trainees.",
            'user' => "Basic user access. Can: view dashboard, update profile, view basic information.",
        ];

        return $capabilities[$role] ?? $capabilities['user'];
    }

    /**
     * Get detailed context information based on current area.
     */
    protected function getDetailedContextInfo(string $context, string $role): string
    {
        $contexts = [
            'admin' => "Admin Dashboard - Central management hub. Features:\n- User management: Add, edit, deactivate users, assign roles\n- Client management: Add clients, configure sites, manage contracts\n- Guard management: Add guards, manage profiles, handle assignments\n- Site management: Configure checkpoints, manage site details\n- Reports: Access all system reports\n- Settings: Configure system-wide settings",

            'superadmin' => "Super Admin Dashboard - Full system control. Features:\n- All admin features plus:\n- Module management: Enable/disable system modules\n- Role & permission management\n- System backups and restore\n- Audit logs and system logs\n- Cache management\n- Maintenance mode control",

            'control-room' => "Control Room - Real-time operations monitoring. Features:\n- Live guard tracking on map\n- Attendance monitoring and check-ins\n- Incident management and response\n- Checkpoint scanning (QR)\n- Zone overview and status\n- Real-time alerts and notifications",

            'hr' => "HR Module - Human resources management. Features:\n- Employee management and records\n- Training programs and evaluations\n- Benefits administration\n- Medical claims processing\n- Pension management\n- Compensation and payroll support\n- Leave management (off-days, holidays)",

            'finance' => "Finance Module - Financial operations. Features:\n- Payroll processing\n- Requisitions management\n- Invoice generation and tracking\n- Budget management\n- Client billing\n- Financial reports",

            'assets' => "Assets Module - Vehicle and equipment management. Features:\n- Vehicle registration and tracking\n- Equipment inventory\n- Dispatch management\n- Maintenance scheduling\n- Asset handovers\n- Utilization reports",

            'operations' => "Operations Module - Daily operations management. Features:\n- Guard assignments\n- Shift scheduling\n- Incident reporting\n- Site coverage tracking\n- Operations reports",

            'supervisor' => "Supervisor Dashboard - Zone management. Features:\n- View guards in your zone\n- Monitor zone attendance\n- Handle zone incidents\n- View zone reports\n- Coordinate with zone commander",

            'zone-commander' => "Zone Commander Dashboard - Zone command. Features:\n- Manage zone guards\n- Handle zone assignments\n- Monitor zone operations\n- Respond to zone incidents\n- Zone performance reports",

            'client' => "Client Portal - Client self-service. Features:\n- View contracted sites\n- See assigned guards\n- View attendance reports\n- Access invoices\n- Submit service requests",

            'landing' => "Public Landing Page - Marketing and information. This is for potential customers exploring Coin Security services. You can explain: security services offered, pricing inquiries, how to contact sales, company information.",

            'dashboard' => "Main Dashboard - Overview of system status. Shows quick stats, recent activity, and shortcuts to common actions based on your role.",
        ];

        return $contexts[$context] ?? "You are in the {$context} area of the system.";
    }

    /**
     * Get system statistics for context.
     */
    protected function getSystemStats(string $role): string
    {
        try {
            $stats = [];

            // Only show stats relevant to the role
            if (in_array($role, ['super_admin', 'admin', 'hr'])) {
                $stats[] = "Total Guards: " . Guard::count();
                $stats[] = "Active Guards: " . Guard::where('status', 'active')->count();
            }

            if (in_array($role, ['super_admin', 'admin'])) {
                $stats[] = "Total Clients: " . Client::count();
                $stats[] = "Active Sites: " . Site::where('status', 'active')->count();
                $stats[] = "Total Users: " . User::count();
            }

            if ($role === 'client') {
                $user = Auth::user();
                if ($user && $user->client) {
                    $stats[] = "Your Sites: " . Site::where('client_id', $user->client->id)->count();
                }
            }

            // Add current time
            $stats[] = "Current Time: " . now()->format('H:i') . " (" . now()->format('d M Y') . ")";

            return implode("\n", $stats);
        } catch (\Exception $e) {
            return "System statistics temporarily unavailable.";
        }
    }

    /**
     * Build messages array for API.
     */
    protected function buildMessagesArray(string $systemPrompt, array $history, string $message): array
    {
        $messages = [['role' => 'system', 'content' => $systemPrompt]];

        foreach ($history as $h) {
            $messages[] = [
                'role' => $h['role'],
                'content' => $h['content'],
            ];
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        return $messages;
    }

    /**
     * Call AI provider based on settings.
     */
    protected function callAI(AiSetting $provider, array $messages): string
    {
        switch ($provider->provider) {
            case 'gemini':
                return $this->callGemini($provider, $messages);
            case 'anthropic':
                return $this->callAnthropic($provider, $messages);
            default:
                // OpenAI-compatible APIs (OpenAI, Groq, Together, OpenRouter, Mistral)
                return $this->callOpenAICompatible($provider, $messages);
        }
    }

    /**
     * Call OpenAI-compatible API (OpenAI, Groq, Together, OpenRouter, Mistral).
     */
    protected function callOpenAICompatible(AiSetting $provider, array $messages): string
    {
        $response = \Http::withHeaders([
            'Authorization' => 'Bearer ' . $provider->api_key,
            'Content-Type' => 'application/json',
        ])->post(rtrim($provider->base_url, '/') . '/chat/completions', [
            'model' => $provider->model,
            'messages' => $messages,
            'max_tokens' => $provider->max_tokens,
            'temperature' => (float) $provider->temperature,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? $this->getSmartFallbackResponse(
                $messages[count($messages) - 1]['content'],
                'general',
                'user',
                []
            );
        }

        \Log::error('AI API Error: ' . $response->body());
        return $this->getSmartFallbackResponse(
            $messages[count($messages) - 1]['content'],
            'general',
            'user',
            []
        );
    }

    /**
     * Call OpenAI API directly (legacy support).
     */
    protected function callOpenAI(string $apiKey, array $messages, string $model = 'gpt-3.5-turbo'): string
    {
        $response = \Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => 1000,
            'temperature' => 0.7,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? $this->getSmartFallbackResponse(
                $messages[count($messages) - 1]['content'],
                'general',
                'user',
                []
            );
        }

        return $this->getSmartFallbackResponse(
            $messages[count($messages) - 1]['content'],
            'general',
            'user',
            []
        );
    }

    /**
     * Call Google Gemini API.
     */
    protected function callGemini(AiSetting $provider, array $messages): string
    {
        // Convert messages to Gemini format
        $contents = [];
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                // Gemini uses systemInstruction at the root level
                continue;
            }
            $contents[] = [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]],
            ];
        }

        $systemInstruction = null;
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemInstruction = $msg['content'];
                break;
            }
        }

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => $provider->max_tokens,
                'temperature' => (float) $provider->temperature,
            ],
        ];

        if ($systemInstruction) {
            $payload['systemInstruction'] = ['parts' => [['text' => $systemInstruction]]];
        }

        $response = \Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(rtrim($provider->base_url, '/') . "/models/{$provider->model}:generateContent?key={$provider->api_key}", $payload);

        if ($response->successful()) {
            $data = $response->json();
            return $data['candidates'][0]['content']['parts'][0]['text'] ?? $this->getSmartFallbackResponse(
                $messages[count($messages) - 1]['content'],
                'general',
                'user',
                []
            );
        }

        \Log::error('Gemini API Error: ' . $response->body());
        return $this->getSmartFallbackResponse(
            $messages[count($messages) - 1]['content'],
            'general',
            'user',
            []
        );
    }

    /**
     * Call Anthropic Claude API.
     */
    protected function callAnthropic(AiSetting $provider, array $messages): string
    {
        // Convert messages to Anthropic format
        $anthropicMessages = [];
        $systemPrompt = null;

        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemPrompt = $msg['content'];
                continue;
            }
            $anthropicMessages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        $payload = [
            'model' => $provider->model,
            'max_tokens' => $provider->max_tokens,
            'messages' => $anthropicMessages,
        ];

        if ($systemPrompt) {
            $payload['system'] = $systemPrompt;
        }

        $response = \Http::withHeaders([
            'x-api-key' => $provider->api_key,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->post(rtrim($provider->base_url, '/') . '/messages', $payload);

        if ($response->successful()) {
            $data = $response->json();
            return $data['content'][0]['text'] ?? $this->getSmartFallbackResponse(
                $messages[count($messages) - 1]['content'],
                'general',
                'user',
                []
            );
        }

        \Log::error('Anthropic API Error: ' . $response->body());
        return $this->getSmartFallbackResponse(
            $messages[count($messages) - 1]['content'],
            'general',
            'user',
            []
        );
    }

    /**
     * Get smart fallback response based on context and role.
     */
    protected function getSmartFallbackResponse(string $message, string $context, string $role, array $pageData): string
    {
        $lowerMessage = strtolower($message);

        // Greeting responses
        if ($this->matchesKeywords($lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
            $greeting = "Hello! I'm here to help you with the {$context} area. ";
            $greeting .= "What would you like to know or do today?";
            return $greeting;
        }

        // Help request
        if ($this->matchesKeywords($lowerMessage, ['help', 'what can', 'how do', 'guide', 'tutorial'])) {
            return $this->getContextualHelp($context, $role, $message);
        }

        // Guard-related queries
        if ($this->matchesKeywords($lowerMessage, ['guard', 'employee', 'staff', 'officer'])) {
            return $this->getGuardHelp($lowerMessage, $role);
        }

        // Site-related queries
        if ($this->matchesKeywords($lowerMessage, ['site', 'location', 'checkpoint', 'client'])) {
            return $this->getSiteHelp($lowerMessage, $role);
        }

        // Attendance-related queries
        if ($this->matchesKeywords($lowerMessage, ['attendance', 'check-in', 'check-out', 'clock', 'scan', 'qr'])) {
            return $this->getAttendanceHelp($lowerMessage, $role);
        }

        // Payroll-related queries
        if ($this->matchesKeywords($lowerMessage, ['payroll', 'salary', 'pay', 'payslip', 'deduction', 'overtime'])) {
            return $this->getPayrollHelp($role);
        }

        // Report-related queries
        if ($this->matchesKeywords($lowerMessage, ['report', 'analytics', 'statistics', 'summary', 'export'])) {
            return $this->getReportHelp($context, $role);
        }

        // Vehicle/Asset queries
        if ($this->matchesKeywords($lowerMessage, ['vehicle', 'car', 'truck', 'motorcycle', 'equipment', 'asset'])) {
            return $this->getAssetHelp($lowerMessage, $role);
        }

        // Assignment queries
        if ($this->matchesKeywords($lowerMessage, ['assign', 'assignment', 'schedule', 'shift', 'roster'])) {
            return $this->getAssignmentHelp($role);
        }

        // Incident queries
        if ($this->matchesKeywords($lowerMessage, ['incident', 'accident', 'emergency', 'alert', 'alarm'])) {
            return $this->getIncidentHelp($role);
        }

        // User management queries
        if ($this->matchesKeywords($lowerMessage, ['user', 'account', 'password', 'login', 'role', 'permission'])) {
            return $this->getUserManagementHelp($lowerMessage, $role);
        }

        // Landing page specific
        if ($context === 'landing') {
            return $this->getLandingPageHelp($message);
        }

        // Default contextual response
        return $this->getDefaultResponse($context, $role);
    }

    /**
     * Check if message matches any keywords.
     */
    protected function matchesKeywords(string $message, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (str_contains($message, $keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get contextual help based on current area.
     */
    protected function getContextualHelp(string $context, string $role, string $message): string
    {
        $help = [];

        switch ($context) {
            case 'admin':
                $help[] = "In the Admin Dashboard, you can:";
                $help[] = "1. **Manage Users** - Add users, assign roles, reset passwords";
                $help[] = "2. **Manage Guards** - Add guards, update profiles, handle assignments";
                $help[] = "3. **Manage Clients** - Add clients, configure sites, manage contracts";
                $help[] = "4. **View Reports** - Access attendance, payroll, and operational reports";
                $help[] = "5. **Configure Settings** - Set up system parameters";
                break;

            case 'control-room':
                $help[] = "In the Control Room, you can:";
                $help[] = "1. **Monitor Guards** - See real-time guard locations and status";
                $help[] = "2. **Handle Check-ins** - Manual check-in, QR scanning";
                $help[] = "3. **Manage Incidents** - Create, assign, and track incidents";
                $help[] = "4. **View Alerts** - Respond to attendance exceptions";
                break;

            case 'hr':
                $help[] = "In the HR Module, you can:";
                $help[] = "1. **Manage Employees** - Add employees, update records";
                $help[] = "2. **Training** - Create programs, evaluate trainees";
                $help[] = "3. **Benefits** - Process benefit claims";
                $help[] = "4. **Medical** - Handle medical claims";
                $help[] = "5. **Leave** - Manage off-days and holidays";
                break;

            case 'finance':
                $help[] = "In the Finance Module, you can:";
                $help[] = "1. **Payroll** - Process monthly salaries";
                $help[] = "2. **Requisitions** - Handle purchase requests";
                $help[] = "3. **Invoices** - Generate and track invoices";
                $help[] = "4. **Budgets** - Manage department budgets";
                break;

            case 'assets':
                $help[] = "In the Assets Module, you can:";
                $help[] = "1. **Vehicles** - Register, dispatch, track maintenance";
                $help[] = "2. **Equipment** - Manage inventory, assign to guards";
                $help[] = "3. **Reports** - View utilization and maintenance reports";
                break;

            default:
                $help[] = "I can help you navigate the system. What would you like to do?";
        }

        $help[] = "\nWhat specifically would you like help with?";

        return implode("\n", $help);
    }

    /**
     * Get guard-related help.
     */
    protected function getGuardHelp(string $message, string $role): string
    {
        if (str_contains($message, 'add') || str_contains($message, 'create') || str_contains($message, 'new')) {
            if (!in_array($role, ['admin', 'super_admin', 'hr'])) {
                return "Adding guards requires Admin or HR role. You can request this from your administrator.";
            }
            return "To add a new guard:\n\n1. Go to Guards menu\n2. Click 'Add Guard'\n3. Fill in: Name, Phone, Zone, Role\n4. Upload photo (optional)\n5. Click 'Save'\n\nThe guard will then be available for assignment.";
        }

        if (str_contains($message, 'assign')) {
            return "To assign a guard to a site:\n\n1. Find the guard in the Guards list\n2. Click 'Assign' button\n3. Select site and shift\n4. Set assignment dates\n5. Confirm\n\nYou can also assign from Operations > Assignments.";
        }

        if (str_contains($message, 'list') || str_contains($message, 'view') || str_contains($message, 'all')) {
            return "View all guards:\n\n- Admin: Go to Admin > Guards\n- HR: Go to HR > Guards\n- Supervisor: View your zone's guards in Supervisor Dashboard\n\nUse filters to search by name, zone, or status.";
        }

        return "I can help with guards. You can ask about:\n- Adding new guards\n- Assigning guards to sites\n- Viewing guard lists\n- Guard profiles and details\n\nWhat would you like to know?";
    }

    /**
     * Get site-related help.
     */
    protected function getSiteHelp(string $message, string $role): string
    {
        if (str_contains($message, 'add') || str_contains($message, 'create')) {
            if (!in_array($role, ['admin', 'super_admin'])) {
                return "Adding sites requires Admin role. Contact your administrator.";
            }
            return "To add a new site:\n\n1. Go to Clients > Select client\n2. Click 'Add Site'\n3. Enter site details:\n   - Name and address\n   - Contact person\n   - Checkpoints\n4. Configure shift schedule\n5. Save the site";
        }

        if (str_contains($message, 'checkpoint')) {
            return "Checkpoint management:\n\n1. Go to Site Details\n2. Click 'Checkpoints' tab\n3. Add checkpoints with:\n   - Name/location\n   - QR code (auto-generated)\n   - Required scan times\n4. Guards scan QR at each checkpoint";
        }

        return "I can help with sites. You can ask about:\n- Adding new sites\n- Configuring checkpoints\n- Managing site details\n- Viewing site status\n\nWhat would you like to know?";
    }

    /**
     * Get attendance-related help.
     */
    protected function getAttendanceHelp(string $message, string $role): string
    {
        if (str_contains($message, 'check-in') || str_contains($message, 'check in')) {
            return "Guards can check in via:\n\n**QR Code Scanning:**\n1. Open mobile app or go to Control Room\n2. Scan checkpoint QR code\n3. GPS location verified automatically\n\n**Manual Check-in (Control Room):**\n1. Go to Control Room > Attendance\n2. Select guard\n3. Click 'Check In'\n4. Select site and time";
        }

        if (str_contains($message, 'report') || str_contains($message, 'view')) {
            return "View attendance reports:\n\n- Control Room: Real-time attendance\n- Reports > Attendance: Historical data\n- Filter by date, site, or guard\n- Export to Excel/PDF";
        }

        return "I can help with attendance. Topics:\n- How guards check in/out\n- Viewing attendance records\n- Handling missed check-outs\n- Attendance reports\n\nWhat do you need?";
    }

    /**
     * Get payroll-related help.
     */
    protected function getPayrollHelp(string $role): string
    {
        if (!in_array($role, ['admin', 'super_admin', 'finance'])) {
            return "Payroll access is restricted to Finance and Admin roles. Guards can view their own payslips in their profile.";
        }

        return "Processing Payroll:\n\n1. Go to Finance > Payroll\n2. Select pay period (month)\n3. Review summary:\n   - Days worked\n   - Overtime hours\n   - Deductions (NAPSA, NHIMA)\n   - Bonuses/Allowances\n4. Make adjustments if needed\n5. Click 'Process Payroll'\n6. Print payslips or export\n\nPayroll is calculated from attendance data.";
    }

    /**
     * Get report-related help.
     */
    protected function getReportHelp(string $context, string $role): string
    {
        $reports = '';

        switch ($context) {
            case 'control-room':
                $reports = "Control Room Reports:\n- Real-time attendance\n- Incident reports\n- Checkpoint scan logs\n- Zone coverage";
                break;
            case 'hr':
                $reports = "HR Reports:\n- Employee statistics\n- Training completion\n- Leave balance\n- Medical claims summary";
                break;
            case 'finance':
                $reports = "Finance Reports:\n- Payroll summary\n- Invoice tracking\n- Budget vs Actual\n- Client billing";
                break;
            case 'assets':
                $reports = "Asset Reports:\n- Vehicle utilization\n- Maintenance due\n- Equipment inventory\n- Dispatch history";
                break;
            default:
                $reports = "Available Reports:\n- Attendance reports\n- Incident reports\n- Payroll reports\n- Asset utilization\n- Client billing";
        }

        return $reports . "\n\nAccess reports from the Reports menu in each module. You can filter by date range and export to Excel or PDF.";
    }

    /**
     * Get asset-related help.
     */
    protected function getAssetHelp(string $message, string $role): string
    {
        if (str_contains($message, 'vehicle')) {
            return "Vehicle Management:\n\n**Add Vehicle:**\n1. Go to Assets > Vehicles\n2. Click 'Add Vehicle'\n3. Enter registration, make, model\n4. Set status (active/maintenance)\n\n**Dispatch Vehicle:**\n1. Select available vehicle\n2. Click 'Dispatch'\n3. Assign driver and destination\n4. Set expected return time";
        }

        if (str_contains($message, 'equipment')) {
            return "Equipment Management:\n\n**Add Equipment:**\n1. Go to Assets > Equipment\n2. Click 'Add Equipment'\n3. Enter name, type, serial number\n\n**Assign to Guard:**\n1. Select equipment\n2. Click 'Assign'\n3. Select guard\n4. Record condition";
        }

        return "I can help with assets:\n- Vehicle registration and dispatch\n- Equipment inventory\n- Maintenance tracking\n- Handover procedures\n\nWhat do you need?";
    }

    /**
     * Get assignment-related help.
     */
    protected function getAssignmentHelp(string $role): string
    {
        return "Managing Assignments:\n\n**Create Assignment:**\n1. Go to Operations > Assignments\n2. Click 'New Assignment'\n3. Select guard, site, and shift\n4. Set start and end dates\n5. Confirm\n\n**View Schedule:**\n- Calendar view shows all assignments\n- Filter by site, guard, or date\n\n**End Assignment:**\n1. Find the assignment\n2. Click 'End'\n3. Optionally add notes";
    }

    /**
     * Get incident-related help.
     */
    protected function getIncidentHelp(string $role): string
    {
        return "Managing Incidents:\n\n**Create Incident:**\n1. Go to Control Room or Operations\n2. Click 'New Incident'\n3. Fill in details:\n   - Type (security, safety, etc.)\n   - Location/Site\n   - Description\n   - Severity\n4. Assign responders\n5. Save\n\n**Track Resolution:**\n- View incident status\n- Add updates\n- Mark as resolved\n- Generate incident report";
    }

    /**
     * Get user management help.
     */
    protected function getUserManagementHelp(string $message, string $role): string
    {
        if (str_contains($message, 'password') || str_contains($message, 'reset')) {
            return "Password Reset:\n\n**For yourself:**\n1. Click profile menu\n2. Go to Profile > Security\n3. Enter current and new password\n\n**For another user (Admin only):**\n1. Go to Admin > Users\n2. Find the user\n3. Click 'Reset Password'\n4. New password will be emailed";
        }

        if (str_contains($message, 'role') || str_contains($message, 'permission')) {
            if (!in_array($role, ['admin', 'super_admin'])) {
                return "Role and permission management requires Admin or Super Admin access.";
            }
            return "Managing Roles:\n\n1. Go to Admin > Roles\n2. View existing roles\n3. Edit permissions for each role\n4. Assign roles to users in User Management\n\nAvailable roles: Super Admin, Admin, HR, Finance, Asset Manager, Control Room, Supervisor, Zone Commander, Client, Guard.";
        }

        return "I can help with user management:\n- Adding users\n- Resetting passwords\n- Assigning roles\n- Managing permissions\n\nWhat do you need?";
    }

    /**
     * Get landing page help for potential customers.
     */
    protected function getLandingPageHelp(string $message): string
    {
        $lowerMessage = strtolower($message);

        if (str_contains($lowerMessage, 'service')) {
            return "Our Security Services:\n\n**Manned Guarding:**\n- Trained security officers\n- 24/7 site coverage\n- Mobile patrol services\n\n**Electronic Security:**\n- CCTV surveillance\n- Access control systems\n- Alarm monitoring\n\n**Specialized Services:**\n- Event security\n- Executive protection\n- Security consulting\n\nWould you like details on any service?";
        }

        if (str_contains($lowerMessage, 'price') || str_contains($lowerMessage, 'cost') || str_contains($lowerMessage, 'quote')) {
            return "Pricing Information:\n\nOur services are customized based on your needs:\n- Number of guards required\n- Coverage hours\n- Site location and risk level\n- Additional services (CCTV, patrols)\n\nFor a detailed quote, please:\n1. Fill out our contact form\n2. Call us at our office number\n3. Email: sales@coinsecurity.com\n\nWe'll provide a tailored proposal within 24 hours.";
        }

        if (str_contains($lowerMessage, 'contact') || str_contains($lowerMessage, 'reach') || str_contains($lowerMessage, 'call')) {
            return "Contact Us:\n\n**Phone:** Available on our Contact page\n**Email:** sales@coinsecurity.com\n**Office Hours:** Monday - Friday, 8:00 - 17:00\n\nYou can also fill out the contact form on our website and we'll get back to you promptly.";
        }

        return "Welcome to Coin Security! I can help you with:\n\n- **Services** - Our security offerings\n- **Pricing** - Getting a quote\n- **Contact** - How to reach us\n- **Company** - About Coin Security\n\nWhat would you like to know?";
    }

    /**
     * Get default response when no specific match.
     */
    protected function getDefaultResponse(string $context, string $role): string
    {
        return "I'm here to help with the {$context} area. You can ask me about:\n\n- How to perform tasks\n- Where to find features\n- Understanding reports\n- Troubleshooting issues\n\nOr type 'help' for a guide to this area. What would you like to know?";
    }
}
