<?php

namespace App\Services;

use App\Models\AiAssistantSetting;
use App\Models\AiSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AiConfigSyncService
{
    /**
     * Sync DB-backed AI settings into the runtime config used by laravel-ai-agent.
     */
    public function sync(): void
    {
        if (! $this->canAccessDatabase()) {
            return;
        }

        $provider = Cache::remember('ai_active_provider', 300, function () {
            return AiSetting::where('enabled', true)->first();
        });

        if ($provider && $provider->hasApiKey()) {
            config([
                'ai-agent.default' => $provider->provider,
                "ai-agent.drivers.{$provider->provider}" => $this->buildDriverConfig($provider),
            ]);
        }

        $assistant = AiAssistantSetting::getActiveAssistant();
        if ($assistant) {
            config([
                'ai-agent.widget.title' => $assistant->title ?: 'AI Assistant',
                'ai-agent.widget.system_prompt' => $assistant->description ?: 'You are a helpful assistant.',
            ]);
        }
    }

    /**
     * Build a config payload for the package driver.
     */
    protected function buildDriverConfig(AiSetting $provider): array
    {
        $config = [
            'api_key' => $provider->api_key,
            'model' => $provider->model,
            'base_url' => $provider->base_url,
            'timeout' => 60,
            'retry' => [
                'times' => 3,
                'sleep' => 1000,
            ],
        ];

        // Add provider-specific settings
        if ($provider->provider === 'openrouter') {
            $config['site_url'] = config('app.url');
            $config['site_name'] = config('app.name', 'Laravel AI Agent');
        }

        return $config;
    }

    /**
     * Avoid touching the database when it is not available.
     */
    protected function canAccessDatabase(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
