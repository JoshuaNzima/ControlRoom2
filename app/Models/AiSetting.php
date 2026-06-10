<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AiSetting extends Model
{
    protected $fillable = [
        'provider',
        'enabled',
        'api_key',
        'model',
        'base_url',
        'max_tokens',
        'temperature',
        'description',
        'free_models',
        'free_tier',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'free_tier' => 'boolean',
        'free_models' => 'array',
        'max_tokens' => 'integer',
        'temperature' => 'decimal:2',
    ];

    /**
     * Boot the model - clear cache when settings change.
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($model) {
            Cache::forget('ai_active_provider');
        });

        static::deleted(function ($model) {
            Cache::forget('ai_active_provider');
        });
    }

    /**
     * Get settings for a specific provider.
     */
    public static function getProvider(string $provider): ?self
    {
        return static::where('provider', $provider)->first();
    }

    /**
     * Get the active provider settings.
     */
    public static function getActiveProvider(): ?self
    {
        return static::where('enabled', true)->first();
    }

    /**
     * Get all enabled providers.
     */
    public static function getEnabledProviders(): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('enabled', true)->get();
    }

    /**
     * Check if provider has valid API key.
     */
    public function hasApiKey(): bool
    {
        return !empty($this->api_key);
    }

    /**
     * Get available models for this provider.
     */
    public function getAvailableModels(): array
    {
        return $this->free_models ?? [];
    }
}
