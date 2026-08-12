<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    /**
     * Get VAPID public key for frontend
     */
    public function vapidPublicKey()
    {
        return response()->json([
            'success' => true,
            'publicKey' => config('webpush.vapid.public_key'),
        ]);
    }

    /**
     * Store a new push subscription
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = Auth::user();

        // Check if subscription already exists
        $existingSubscription = PushSubscription::where('endpoint', $validated['endpoint'])->first();

        if ($existingSubscription) {
            // Update existing subscription
            $existingSubscription->update([
                'user_id' => $user->id,
                'p256dh_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'user_agent' => $request->userAgent(),
                'is_active' => true,
                'subscribed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription updated',
                'subscription' => $existingSubscription->only(['id', 'endpoint', 'is_active']),
            ]);
        }

        // Create new subscription
        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $validated['endpoint'],
            'p256dh_key' => $validated['keys']['p256dh'],
            'auth_token' => $validated['keys']['auth'],
            'user_agent' => $request->userAgent(),
            'device_type' => 'web',
            'is_active' => true,
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created',
            'subscription' => $subscription->only(['id', 'endpoint', 'is_active']),
        ], 201);
    }

    /**
     * Deactivate a subscription
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|url',
        ]);

        $subscription = PushSubscription::where('endpoint', $validated['endpoint'])
            ->where('user_id', Auth::id())
            ->first();

        if ($subscription) {
            $subscription->deactivate();
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription deactivated',
        ]);
    }

    /**
     * Get user's subscriptions
     */
    public function index()
    {
        $subscriptions = Auth::user()
            ->pushSubscriptions()
            ->active()
            ->get(['id', 'endpoint', 'device_type', 'user_agent', 'subscribed_at', 'created_at']);

        return response()->json([
            'success' => true,
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Test push notification to current user
     */
    public function test()
    {
        $user = Auth::user();
        
        $service = new \App\Services\PushNotificationService();
        
        $payload = \App\Services\PushNotificationService::createPayload(
            'Test Notification',
            'This is a test push notification from ControlRoom',
            null,
            config('app.url'),
            'test-notification',
            ['type' => 'test']
        );

        $result = $service->sendToUser($user, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Test notification sent',
            'result' => $result,
        ]);
    }
}
