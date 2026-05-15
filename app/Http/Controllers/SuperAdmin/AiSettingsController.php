<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AiSetting;
use App\Models\AiAssistantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AiSettingsController extends Controller
{
    /**
     * Display AI settings page.
     */
    public function index()
    {
        $providers = AiSetting::orderBy('provider')->get();
        $activeProvider = AiSetting::getActiveProvider();

        return inertia('SuperAdmin/AiSettings', [
            'providers' => $providers,
            'activeProvider' => $activeProvider,
        ]);
    }

    /**
     * Update a provider's settings.
     */
    public function update(Request $request, string $provider)
    {
        $validated = $request->validate([
            'enabled' => 'boolean',
            'api_key' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:100',
            'base_url' => 'nullable|string|max:255',
            'max_tokens' => 'integer|min:100|max:4000',
            'temperature' => 'numeric|min:0|max:2',
        ]);

        $setting = AiSetting::where('provider', $provider)->firstOrFail();

        // If enabling this provider, disable others
        if (!empty($validated['enabled']) && !$setting->enabled) {
            AiSetting::where('enabled', true)->update(['enabled' => false]);
        }

        $setting->update($validated);

        // Clear cached settings
        Cache::forget('ai_active_provider');
        Cache::forget('ai_providers');

        return back()->with('success', "{$provider} settings updated successfully.");
    }

    /**
     * Enable a provider.
     */
    public function enable(string $provider)
    {
        $setting = AiSetting::where('provider', $provider)->firstOrFail();

        // Disable all providers first
        AiSetting::query()->update(['enabled' => false]);

        // Enable this one
        $setting->update(['enabled' => true]);

        // Clear cached settings
        Cache::forget('ai_active_provider');
        Cache::forget('ai_providers');

        return back()->with('success', "{$provider} enabled as the active AI provider.");
    }

    /**
     * Disable a provider.
     */
    public function disable(string $provider)
    {
        $setting = AiSetting::where('provider', $provider)->firstOrFail();
        $setting->update(['enabled' => false]);

        // Clear cached settings
        Cache::forget('ai_active_provider');
        Cache::forget('ai_providers');

        return back()->with('success', "{$provider} disabled.");
    }

    /**
     * List enabled assistants.
     */
    public function assistants()
    {
        return response()->json([
            'success' => true,
            'assistants' => AiAssistantSetting::query()
                ->orderBy('id')
                ->get(['assistant', 'enabled', 'title', 'description']),
            'activeAssistant' => AiAssistantSetting::getActiveAssistant()?->assistant,
        ]);
    }

    /**
     * Enable an assistant (does NOT automatically set it active).
     */
    public function enableAssistant(string $assistant)
    {
        AiAssistantSetting::query()->where('assistant', $assistant)->firstOrCreate(
            ['assistant' => $assistant],
            ['enabled' => true, 'title' => $assistant, 'description' => null]
        );

        AiAssistantSetting::query()->where('assistant', $assistant)->update(['enabled' => true]);

        return back()->with('success', "Assistant '{$assistant}' enabled.");
    }

    /**
     * Disable an assistant. If it was active, activate the first enabled assistant (fallback).
     */
    public function disableAssistant(string $assistant)
    {
        AiAssistantSetting::query()->where('assistant', $assistant)->update(['enabled' => false]);

        $active = AiAssistantSetting::getActiveAssistant();
        if ($active && $active->assistant === $assistant) {
            $firstEnabled = AiAssistantSetting::query()->where('enabled', true)->orderBy('id')->first();
            if ($firstEnabled) {
                AiAssistantSetting::setActiveAssistant($firstEnabled->assistant);
            }
        }

        return back()->with('success', "Assistant '{$assistant}' disabled.");
    }

    /**
     * Set active assistant (exactly one enabled).
     */
    public function setActiveAssistant(Request $request, string $assistant)
    {
        // Validate assistant slug is one we know.
        $allowed = ['control-room', 'help-center'];
        if (!in_array($assistant, $allowed, true)) {
            return back()->with('error', 'Invalid assistant.');
        }

        // Ensure it exists and is enabled.
        AiAssistantSetting::setActiveAssistant($assistant);

        return back()->with('success', "Active assistant set to '{$assistant}'.");
    }

    /**
     * Test a provider's connection.
     */
    public function test(Request $request, string $provider)
    {
        $setting = AiSetting::where('provider', $provider)->firstOrFail();

        if (!$setting->api_key) {
            return back()->with('error', "API key not configured for {$provider}.");
        }

        try {
            $response = $this->testProviderConnection($setting);

            if ($response['success']) {
                return back()->with('success', "Connection to {$provider} successful! Model: {$response['model']}");
            }

            return back()->with('error', "Connection failed: {$response['error']}");
        } catch (\Exception $e) {
            return back()->with('error', "Connection error: {$e->getMessage()}");
        }
    }

    /**
     * Test provider connection.
     */
    protected function testProviderConnection(AiSetting $setting): array
    {
        $baseUrl = $setting->base_url;
        $apiKey = $setting->api_key;
        $model = $setting->model;

        // Different providers have different API formats
        switch ($setting->provider) {
            case 'gemini':
                return $this->testGemini($baseUrl, $apiKey, $model);
            case 'anthropic':
                return $this->testAnthropic($baseUrl, $apiKey, $model);
            default:
                // OpenAI-compatible APIs (OpenAI, Groq, Together, OpenRouter, Mistral)
                return $this->testOpenAICompatible($baseUrl, $apiKey, $model);
        }
    }

    /**
     * Test OpenAI-compatible API.
     */
    protected function testOpenAICompatible(string $baseUrl, string $apiKey, string $model): array
    {
        try {
            $response = \Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post(rtrim($baseUrl, '/') . '/chat/completions', [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => 'Say "Connection successful"']],
                'max_tokens' => 10,
            ]);

            if ($response->successful()) {
                return ['success' => true, 'model' => $model];
            }

            return ['success' => false, 'error' => $response->json('error.message', 'Unknown error')];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Test Gemini API.
     */
    protected function testGemini(string $baseUrl, string $apiKey, string $model): array
    {
        try {
            $response = \Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post(rtrim($baseUrl, '/') . "/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [['parts' => [['text' => 'Say "Connection successful"']]]],
            ]);

            if ($response->successful()) {
                return ['success' => true, 'model' => $model];
            }

            return ['success' => false, 'error' => $response->json('error.message', 'Unknown error')];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Test Anthropic API.
     */
    protected function testAnthropic(string $baseUrl, string $apiKey, string $model): array
    {
        try {
            $response = \Http::withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ])->post(rtrim($baseUrl, '/') . '/messages', [
                'model' => $model,
                'max_tokens' => 10,
                'messages' => [['role' => 'user', 'content' => 'Say "Connection successful"']],
            ]);

            if ($response->successful()) {
                return ['success' => true, 'model' => $model];
            }

            return ['success' => false, 'error' => $response->json('error.message', 'Unknown error')];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get provider models list.
     */
    public function models(string $provider)
    {
        $setting = AiSetting::where('provider', $provider)->firstOrFail();

        return response()->json([
            'success' => true,
            'models' => $setting->free_models ?? [],
            'current' => $setting->model,
        ]);
    }
}
